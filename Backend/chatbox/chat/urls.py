from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import *

router = DefaultRouter()

router = DefaultRouter()

router.register(
    "conversations",
    ConversationViewSet,
    basename="conversation"
)

router.register(
    "chat",
    ChatViewSet,
    basename="chat"
)

urlpatterns = [

    
    path("home/", home),
    path("register/",Registerview.as_view()),
    path('login/',Loginview.as_view()),
    path("messages/<int:conversation_id>/",MessageViewSet.as_view({"get": "list"})),
    path("", include(router.urls)),

]