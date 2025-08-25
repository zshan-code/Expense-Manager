from django import forms
from .models import Transaction

class TransactionForm(forms.ModelForm):
    class Meta:
        model = Transaction
        fields = ['name', 'comment', 'amount_received', 'amount_paid']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'w-full px-4 py-3 bg-ivory-50 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500',
                'required': True
            }),
            'comment': forms.Textarea(attrs={
                'class': 'w-full px-4 py-3 bg-ivory-50 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500',
                'rows': 3
            }),
            'amount_received': forms.NumberInput(attrs={
                'class': 'w-full px-4 py-3 bg-ivory-50 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500',
                'step': '0.01',
                'min': '0',
                'placeholder': '0.00'
            }),
            'amount_paid': forms.NumberInput(attrs={
                'class': 'w-full px-4 py-3 bg-ivory-50 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500',
                'step': '0.01', 
                'min': '0',
                'placeholder': '0.00'
            })
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make amount fields not required - either one can be filled
        self.fields['amount_received'].required = False
        self.fields['amount_paid'].required = False
        self.fields['comment'].required = False
    
    def clean(self):
        cleaned_data = super().clean()
        amount_received = cleaned_data.get('amount_received')
        amount_paid = cleaned_data.get('amount_paid')
        
        # At least one amount should be provided
        if not amount_received and not amount_paid:
            raise forms.ValidationError("Please enter either received amount or paid amount.")
        
        return cleaned_data