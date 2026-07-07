import React, { useEffect, useState } from "react";
import { Menu, X, Mic, Square } from "lucide-react";

const Home = () => {

  const [message, setMessage] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [messages, setMessages] = useState([]);

  const [conversations, setConversations] = useState([]);

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

const [mediaRecorder, setMediaRecorder] = useState(null);

const [audioChunks, setAudioChunks] = useState([]);
  // =========================
  // FETCH CONVERSATIONS
  // =========================

  const fetchConversations = async () => {

    try {

      const response = await fetch(
  "https://ai-chatbox-azrb.onrender.com/api/conversations/",
  {

    headers: {

      Authorization: `Bearer ${localStorage.getItem("access")}`,
    },
  }
);

      const data = await response.json();
     
      setConversations(data);

    } catch (error) {

      console.log(error);
    }
  };

  // =========================
  // LOAD MESSAGES
  // =========================

  const loadConversation = async (conversation) => {

  try {

    setSelectedConversation(conversation);

    const response = await fetch(

      `https://ai-chatbox-azrb.onrender.com/api/messages/${conversation.id}/`,

      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      }
    );

    const data = await response.json();

    setMessages(data);

    setSidebarOpen(false);

  }

  catch (error) {

    console.log(error);
  }
};


let localAudioChunks = [];

const startRecording = async () => {

  try {

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const options = {
  mimeType: "audio/webm;codecs=opus"
};

const recorder = new MediaRecorder(
  stream,
  MediaRecorder.isTypeSupported(options.mimeType)
    ? options
    : undefined
);

console.log(
  "Recorder MIME:",
  recorder.mimeType
);

    setMediaRecorder(recorder);

    localAudioChunks = [];

    recorder.ondataavailable = (event) => {

      if (event.data.size > 0) {

        localAudioChunks.push(event.data);
      }
    };

recorder.onstop = () => {

  const audioBlob = new Blob(
    localAudioChunks,
    {
      type: recorder.mimeType || "audio/webm"
    }
  );

  console.log(
    "Blob type:",
    audioBlob.type
  );

  const audioFile = new File(
    [audioBlob],
    "recording.webm",
    {
      type: audioBlob.type
    }
  );

  console.log(audioFile);

  setSelectedFile(audioFile);

  stream.getTracks().forEach(
    track => track.stop()
  );
};

    recorder.start();

    setIsRecording(true);

  }

  catch (error) {

    console.log(error);
  }
};

const stopRecording = () => {

  if (!mediaRecorder) return;

  mediaRecorder.stop();

  setIsRecording(false);
};
  // =========================
  // SEND MESSAGE


 const sendMessage = async () => {
  const fileToSend = selectedFile;
  if (!message.trim() && !fileToSend) return;
  setSelectedFile(null);
  const tempUserMessage = {

    role: "user",
    content: message,
    file:selectedFile,  
  };

  setMessages((prev) => [

    ...prev,

    tempUserMessage
  ]);

  const currentMessage = message;

  setMessage("");

  // CREATE FORMDATA
  const formData = new FormData();

  formData.append(
    "message",
    currentMessage
  );

  // EXISTING CONVERSATION
  if (selectedConversation?.id) {

    formData.append(

      "conversation_id",

      selectedConversation.id
    );
  }

  // FILE APPEND
// FILE APPEND
if (selectedFile) {
  console.log(
    "FILE NAME:",
    selectedFile.name
  );

  console.log(
    "FILE TYPE:",
    selectedFile.type
  );

  console.log(
    "FILE SIZE:",
    selectedFile.size
  );


  formData.append(
    "file",
    selectedFile
  );

  // IMAGE
  if (
    selectedFile.type.startsWith(
      "image/"
    )
  ) {

    formData.append(
      "is_image",
      "true"
    );
  }

  // AUDIO
  else if (
    selectedFile.type.startsWith(
      "audio/"
    )
  ) {

    formData.append(
      "is_audio",
      "true"
    );
  }

  // OTHER FILES
  else {

    formData.append(
      "is_file",
      "true"
    );
  }
}

  // DEBUG
  for (let pair of formData.entries()) {

    console.log(
      pair[0],
      pair[1]
    );
  }

  try {

    const response = await fetch(

      "https://ai-chatbox-azrb.onrender.com/api/chat/",

      {

        method: "POST",

        headers: {

          Authorization:
            `Bearer ${localStorage.getItem("access")}`,
        },

        body: formData
      }
    );

    const data = await response.json();

    console.log(data);
    if (data.audio_url) { 
      const audio = new Audio(data.audio_url); 
      audio.play();
     }     


    const aiMessage = {

      role: "assistant",

      content: data.reply,
    };

    setMessages((prev) => [

      ...prev,

      aiMessage
    ]);

    setSelectedFile(null);

    fetchConversations();

  }

  catch (error) {

    console.log(error);

    setMessages((prev) => [

      ...prev,

      {

        role: "assistant",

        content: "Something broke 💀",
      },
    ]);
  }
};

  // =========================
  // ENTER KEY
  // =========================

  const handleKeyDown = (e) => {

    if (e.key === "Enter") {

      sendMessage();
    }
  };

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {

    fetchConversations();

  }, []);

  return (

    <div className="flex h-screen bg-black text-white overflow-hidden">

      {/* MOBILE OVERLAY */}

      {sidebarOpen && (

        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}

      <div
        className={`
          fixed md:static z-50
          top-0 left-0 h-full
          w-[260px]
          bg-[#0d0d0d]
          border-r border-neutral-800
          transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >

        <div className="flex items-center justify-between p-5 border-b border-neutral-800">

          <h1 className="text-lg font-semibold">
            Chats
          </h1>

          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={22} />
          </button>

        </div>

        {/* CONVERSATIONS */}

        <div className="p-3 flex flex-col gap-2">

          {conversations.map((conversation) => (

            <div
              key={conversation.id}

              onClick={() => loadConversation(conversation)}

              className={`
                p-3 rounded-xl cursor-pointer transition

                ${
                  selectedConversation?.id === conversation.id
                  ? "bg-white text-black"
                  : "hover:bg-neutral-900"
                }
              `}
            >

              {conversation.title}

            </div>
          ))}
        </div>
      </div>

      {/* MAIN CHAT */}

      <div className="flex-1 flex flex-col">

        {/* TOPBAR */}

        <div className="h-[70px] border-b border-neutral-800 flex items-center px-4">

          <button
            className="md:hidden mr-4"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          <h1 className="text-lg font-semibold">

            {
              selectedConversation
              ? selectedConversation.title
              : "New Chat"
            }

          </h1>
        </div>

        {/* MESSAGES */}

        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-5">

         {messages.map((msg, index) => (

  <div
    key={index}
    className={`
      max-w-[80%]
      px-4 py-3
      rounded-2xl
      text-sm md:text-base

      ${
        msg.role === "user"
          ? "bg-white text-black self-end"
          : "bg-neutral-900 text-white self-start"
      }
    `}
  >

    {msg.content && (
      <div className="mb-2">
        {msg.content}
      </div>
    )}

    {msg.file &&
      msg.file.type?.startsWith("image/") && (
        <img
          src={URL.createObjectURL(msg.file)}
          alt="uploaded"
          className="
            max-w-[250px]
            rounded-xl
            mt-2
          "
        />
      )}

  </div>
))}
        </div>

 <div className="p-4 border-t border-neutral-800">

  {/* FILE PREVIEW */}
  {selectedFile && (

    <div className="mb-3 bg-neutral-900 p-3 rounded-xl text-sm flex items-center justify-between">

      <span>
        {selectedFile.name}
      </span>

      <button
        onClick={() => setSelectedFile(null)}
        className="text-red-400"
      >
        Remove
      </button>

    </div>
  )}

  <div className="flex items-center gap-3 bg-neutral-900 rounded-2xl px-4 py-3">

    {/* FILE BUTTON */}

    <label className="cursor-pointer">

      <input
        type="file"
        hidden

        onChange={(e) => {

          setSelectedFile(
            e.target.files[0]
          );
        }}
      />

      <div className="text-white text-xl">
        +
      </div>

    </label>

    {/* MESSAGE INPUT */}

    <input
      type="text"

      placeholder="Message..."

      value={message}

      onChange={(e) =>
        setMessage(e.target.value)
      }

      onKeyDown={handleKeyDown}

      className="
        flex-1
        bg-transparent
        outline-none
        text-white
        placeholder:text-neutral-500
      "
    />

<button
  onClick={isRecording ? stopRecording : startRecording}

  className={`
    p-2 rounded-xl transition

    ${
      isRecording
        ? "bg-red-500 text-white"
        : "bg-neutral-800 text-white"
    }
  `}
>

  {
    isRecording
      ? <Square size={20} />
      : <Mic size={20} />
  }

</button>
    {/* SEND BUTTON */}

    <button
      onClick={sendMessage}

      className="
        bg-white
        text-black
        px-5
        py-2
        rounded-xl
        font-medium
      "
    >
      Send
    </button>

  </div>
</div>
      </div>
    </div>
  );
};

export default Home;