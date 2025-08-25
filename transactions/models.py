from django.db import models

class Transaction(models.Model):
    name = models.CharField(max_length=100)
    comment = models.TextField(blank=True, null=True)
    amount_received = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, null=True, blank=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, null=True, blank=True)
    remaining_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    date = models.DateField()
    time = models.TimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-id']  # Show newest first
    
    def __str__(self):
        return f"{self.name} - Balance: {self.remaining_balance}"