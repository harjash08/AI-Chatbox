from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class User(AbstractUser):
    profile_image=models.ImageField(upload_to="profile/",blank=True, null=True)
    bio=models.TextField(max_length=30, blank=True,null=True)

class Conversation(models.Model):
    user=models.ForeignKey(User,on_delete=models.CASCADE)
    title=models.CharField(max_length=50)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    
class Message(models.Model):
    ROLE_CHOICES=[
        ('user','USER'),
        ('assistent','Assistent'),
        ('system','System')
    ]
    conversation=models.ForeignKey(Conversation,on_delete=models.CASCADE,related_name='messages')
    role=models.CharField(max_length=50,choices=ROLE_CHOICES)
    content=models.CharField(max_length=250)
    # image=models.ImageField(upload_to="image/")
    file=models.FileField(upload_to="file/")
    is_image=models.BooleanField(default=False)
    is_file=models.BooleanField(default=False)
    is_audio = models.BooleanField(default=False)
    created_at=models.DateTimeField(auto_now_add=True)
    
    