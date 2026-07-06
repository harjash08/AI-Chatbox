from google import genai
import time
# from django.conf import settings
client = genai.Client(api_key='AIzaSyDueclRoiIhLNiWr3sFToL2vFWDfahHJhc')

uploaded_file = client.files.upload(
    file="yash.mpeg"
)

print("INITIAL:", uploaded_file.state.name)

while True:

    uploaded_file = client.files.get(
        name=uploaded_file.name
    )

    print("STATE:", uploaded_file.state.name)

    if uploaded_file.state.name == "ACTIVE":
        break

    if uploaded_file.state.name == "FAILED":
        print("FAILED PROCESSING")
        exit()

    time.sleep(2)

response = client.models.generate_content(

    model="gemini-2.5-flash",

    contents=[
        uploaded_file,
        "Transcribe this audio."
    ]
)

print(response.text)