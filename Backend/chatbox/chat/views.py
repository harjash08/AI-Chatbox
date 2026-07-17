from django.shortcuts import render
from django.http import HttpResponse
from rest_framework.viewsets import ModelViewSet
from .serializers import *
from .models import *
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
# from openai import OpenAI
from django.conf import settings
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet
from google import genai
from rest_framework.viewsets import ReadOnlyModelViewSet
import os
import time
import subprocess
from gtts import gTTS
import uuid

client = genai.Client(
    api_key=settings.GEMINI_API_KEY,
)

# Create your views here.
def home(request):
    return HttpResponse('hello')

class Registerview(APIView):
    def post(self,request):
        print("User:",request.user)
        serializer=Register(data=request.data)
        if serializer.is_valid():
             serializer.save()
             return Response(
                {
                    "message": "User Registered Successfully"
                },
                status=status.HTTP_201_CREATED
            )
        print("Serializer errors:",serializer.errors)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
 
class Loginview(APIView):
     def post(self,request):
        serializer=Login(data=request.data)
        print(serializer)
        if serializer.is_valid():
             return Response(

                serializer.validated_data,
                print(serializer.validated_data),
                # status=status.HTTP_200_OK

            )

        return Response(

            serializer.errors,

            status=status.HTTP_400_BAD_REQUEST

        )
class ConversationViewSet(ModelViewSet):
    serializer_class=ConversationSerializer
    permission_classes=[IsAuthenticated]
    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user).order_by("-updated_at")




class MessageViewSet(ReadOnlyModelViewSet):

    serializer_class = MessageSerializer

    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        conversation_id = self.kwargs["conversation_id"]

        return Message.objects.filter(

            conversation_id=conversation_id,

            conversation__user=self.request.user

        ).order_by("created_at")
    
class ChatViewSet(ViewSet):

    permission_classes = [IsAuthenticated]

    def create(self, request):

        conversation_id = request.data.get(
            "conversation_id"
        )

        message = request.data.get(
            "message",
            ""
        )

        file = request.FILES.get("file")

        if not message.strip() and not file:

            return Response(
                {
                    "error": "Message or file or audio required"
                },
                status=400
            )

        if conversation_id:

            conversation = Conversation.objects.get(

                id=conversation_id,

                user=request.user
            )

        else:

            title = (

                message[:20]

                if message

                else "New Chat"
            )

            conversation = Conversation.objects.create(

                user=request.user,

                title=title
            )

        Message.objects.create(

            conversation=conversation,

            role="user",

            content=message,

            file=file if file else None
        )

        previous_messages = (
        conversation.messages
        .order_by("-created_at")[:5]
    )
        previous_messages = reversed(previous_messages)

        gemini_contents = []

        for msg in previous_messages:
            if msg.role == "user":

                if msg.file:

                    file_path = msg.file.path

                    if msg.file.name.lower().endswith(

                        (
                            ".jpg",
                            ".jpeg",
                            ".png",
                            ".webp"
                        )
                    ):

                        uploaded_file = client.files.upload(

                            file=file_path
                        )

                        gemini_contents.append(

                            [
                                msg.content or "",

                                uploaded_file
                            ]
                        )

                    

                    elif msg.file.name.lower().endswith(
                        ".pdf"
                    ):

                        uploaded_file =client.files.upload(
                            file=file_path
                        )

                        gemini_contents.append(

                            [
                                f"""
                                User Message:
                                {msg.content}
                                """,

                                uploaded_file
                            ]
                        )
                    elif msg.file.name.lower().endswith(
                        (".webm", ".mpeg", ".mp4", ".wav", ".m4a")):
                            try:
                                    file_path = msg.file.path

                                    wav_path = file_path + ".wav"

                                    # convert to wav (IMPORTANT FIX)
                                    subprocess.run(
                                        [
                                            "ffmpeg",
                                            "-y",
                                            "-i",
                                            file_path,
                                            "-vn",
                                            wav_path
                                        ],
                                        check=True
                                    )

                                    print("Converted to WAV:", wav_path)

                                    uploaded_file = client.files.upload(
                                        file=wav_path
                                    )

                                    max_retries = 5
                                    for i in range(max_retries):

                                        uploaded_file = client.files.get(
                                            name=uploaded_file.name
                                        )

                                        print(f"State={uploaded_file.state.name}")

                                        if uploaded_file.state.name == "ACTIVE":
                                            break

                                        if uploaded_file.state.name == "FAILED":
                                            raise Exception(uploaded_file.error)

                                        time.sleep(1)

                                    if uploaded_file.state.name != "ACTIVE":
                                        raise Exception("File never became ACTIVE")

                                    gemini_contents.append([
                                         """
                                            Listen to the audio and respond naturally as an AI assistant.
                                            Do not transcribe the audio.
                                            Do not explain what the user said.
                                            Reply directly to the user's speech.
                                            """,
                                        uploaded_file
                                    ])

                            except Exception as e:
                                print("AUDIO ERROR:", e)
                                return Response({"error": str(e)}, status=400)

               

                else:

                    gemini_contents.append(

                        msg.content
                    )

           

            else:

                gemini_contents.append(

                    f"""
                    Assistant:
                    {msg.content}
                    """
                )


        try:

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=gemini_contents
            )

            ai_reply = response.text

            audio_url = None

            # Generate voice response only for audio messages
            if (
                file and
                file.name.lower().endswith(
                    (".webm", ".mpeg", ".mp4", ".wav", ".m4a")
                )
            ):

                tts = gTTS(
                    text=ai_reply,
                    lang="en"
                )

                filename = f"{uuid.uuid4()}.mp3"

                voice_dir = os.path.join(
                    settings.MEDIA_ROOT,
                    "voice_replies"
                )

                os.makedirs(
                    voice_dir,
                    exist_ok=True
                )

                audio_path = os.path.join(
                    voice_dir,
                    filename
                )

                tts.save(audio_path)

                audio_url = request.build_absolute_uri(
                    settings.MEDIA_URL +
                    "voice_replies/" +
                    filename
                )

        except Exception as e:

            print(e)

            return Response(
                {
                    "error": str(e)
                },
                status=500
            )


        Message.objects.create(
            conversation=conversation,
            role="assistant",
            content=ai_reply
        )

        return Response({
            "reply": ai_reply,
            "audio_url": audio_url,
            "conversation_id": conversation.id
        })