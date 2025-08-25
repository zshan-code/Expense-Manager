from django.urls import path
from . import views

urlpatterns = [
    path('', views.root_redirect, name="root"),
    path('login/', views.login_view, name="login"),
    path('dashboard/', views.dashboard, name="dashboard"),
    path('logout/', views.logout_view, name="logout"),
    path('delete/<int:transaction_id>/', views.delete_transaction, name='delete_transaction'),
]
