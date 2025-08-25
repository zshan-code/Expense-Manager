from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import AuthenticationForm
from django.http import JsonResponse
import os
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from .models import Transaction
from .forms import TransactionForm
from django.contrib.auth.models import User
import pytz
from decimal import Decimal



def login_view(request):
    """Render login page on GET. Handle normal form POST with hardcoded credentials."""
    if request.method == "GET":
        return render(request, "login.html")

    if request.method == "POST":
        username = (request.POST.get("username") or "").strip()
        password = (request.POST.get("password") or "").strip()

        # Credentials from environment variables
        env_username = os.getenv("APP_USERNAME", "")
        env_password = os.getenv("APP_PASSWORD", "")

        if username == env_username and password == env_password and env_username and env_password:
            user, _ = User.objects.get_or_create(username=env_username)
            user.set_password(env_password)
            user.save()
            login(request, user)
            return redirect("dashboard")

        return render(request, "login.html", {"error_message": "Invalid credentials. Please try again."})

    # Any other method: just show the login page
    return render(request, "login.html")


def calculate_running_balances():
    """Calculate running balance for all transactions"""
    transactions = Transaction.objects.all().order_by('id')  # Oldest first for calculation
    running_balance = Decimal('0.00')
    
    for transaction in transactions:
        running_balance += transaction.amount_received or Decimal('0.00')
        running_balance -= transaction.amount_paid or Decimal('0.00')
        
        # Update the transaction's remaining_balance
        Transaction.objects.filter(id=transaction.id).update(
            remaining_balance=running_balance
        )


@login_required
def dashboard(request):
    if request.method == "POST":
        form = TransactionForm(request.POST)
        if form.is_valid():
            transaction = form.save(commit=False)
            # auto Pakistan timezone
            pk_tz = pytz.timezone("Asia/Karachi")
            now = timezone.now().astimezone(pk_tz)
            transaction.date = now.date()
            transaction.time = now.time()
            
            # Get current running balance
            last_transaction = Transaction.objects.all().order_by('-id').first()
            if last_transaction:
                previous_balance = last_transaction.remaining_balance
            else:
                previous_balance = Decimal('0.00')
            
            # Handle empty/None values - if field is empty, treat as 0
            received = transaction.amount_received if transaction.amount_received is not None else Decimal('0.00')
            paid = transaction.amount_paid if transaction.amount_paid is not None else Decimal('0.00')
            
            # Calculate new balance: Previous + Received - Paid
            new_balance = previous_balance + received - paid
            transaction.remaining_balance = new_balance
            
            transaction.save()
            return redirect("dashboard")
    else:
        form = TransactionForm()
    
    # Get transactions with correct running balance (newest first for display)
    transactions = Transaction.objects.all().order_by('-id')
    
    # Get unique months and years for filters
    dates = Transaction.objects.values_list('date', flat=True).distinct()
    months = []
    years = []
    
    for date in dates:
        if date:
            month = date.strftime('%m')
            year = date.strftime('%Y')
            if month not in months:
                months.append(month)
            if year not in years:
                years.append(year)
    
    months = sorted(months)
    years = sorted(years, reverse=True)
    
    return render(request, "dashboard.html", {
        "form": form, 
        "transactions": transactions,
        "months": months,
        "years": years
    })


@login_required
@csrf_exempt
def delete_transaction(request, transaction_id):
    if request.method == "DELETE":
        try:
            transaction = get_object_or_404(Transaction, id=transaction_id)
            transaction.delete()
            
            # Recalculate all running balances after deletion
            calculate_running_balances()
            
            return JsonResponse({'success': True, 'message': 'Transaction deleted successfully'})
            
        except Transaction.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Transaction not found'}, status=404)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)


def logout_view(request):
    logout(request)
    return redirect("login")


def root_view(request):
    """Return 200 OK at root. If authenticated, go to dashboard; else show login."""
    if request.user.is_authenticated:
        return redirect("dashboard")
    return render(request, "login.html")