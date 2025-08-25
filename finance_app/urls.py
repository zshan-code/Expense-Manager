from django.contrib import admin
from django.urls import path, include

#Project levels
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('transactions.urls')),
]
