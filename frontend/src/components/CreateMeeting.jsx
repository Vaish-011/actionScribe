import { useState } from "react";
import API from "../services/api";
import toast from "react-hot-toast";

function CreateMeeting({ refresh }) {

  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const submitMeeting = async () => {

    if ((!title || !transcript) && !file) {
      toast.error("Provide transcript details or upload a file");
      return;
    }

    try {

      setLoading(true);

      if (file) {
        const formData = new FormData();
        formData.append("title", title || file.name);
        formData.append("file", file);
        await API.post("/meetings/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        await API.post("/meetings/create", {
          title,
          transcript
        });
      }

      toast.success("AI summary generated successfully!");

      setTitle("");
      setTranscript("");
      setFile(null);

      refresh();

    } catch (error) {

      toast.error("Something went wrong");

    } finally {

      setLoading(false);

    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 text-black dark:text-white shadow p-4 rounded">

      <h2 className="text-lg font-semibold mb-3">
        Create Meeting
      </h2>

      <input
        className="border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 
                   text-black dark:text-white 
                   p-2 w-full mb-2 rounded"
        placeholder="Meeting Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 
                   text-black dark:text-white 
                   p-2 w-full mb-2 rounded"
        placeholder="Paste meeting transcript..."
        rows="4"
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
      />

      <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">or upload transcript/audio</div>
      <input
        type="file"
        className="w-full mb-3 text-sm"
        accept=".txt,.pdf,.docx,.mp3,.wav"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
        onClick={submitMeeting}
        disabled={loading}
      >
        {loading ? "Processing Meeting..." : "Process Meeting"}
      </button>

    </div>
  );
}

export default CreateMeeting;