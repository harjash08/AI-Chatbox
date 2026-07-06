from rest_framework import serializers
from .models import *
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
class Register(serializers.ModelSerializer):
    class Meta:
        model=User
        fields=['username','password','email','profile_image','bio']
    def create(self, validated_data):
        user=User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email'),
            # profile_image=validated_data.get('profile_image'),
            # bio=validated_data.get('bio')
        )
        return user
    
class Login(serializers.Serializer):
    username=serializers.CharField()
    password=serializers.CharField()
    def validate(self, attrs):
        username=attrs.get("username")
        password=attrs.get("password")
        user=authenticate(
            username=username,
            password=password
        )

        if not user:
            raise serializers.ValidationError(
                "invalid credentials"
            )
        
        refresh=RefreshToken.for_user(user)
        return({
            'refresh':str(refresh),
            'access':str(refresh.access_token)
        })
    
class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model=Message
        fields='__all__'

class ConversationSerializer(serializers.ModelSerializer):

    # messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = '__all__'
