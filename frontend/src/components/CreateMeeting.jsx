import { useState } from "react";
import API from "../services/api";
import toast from "react-hot-toast";

function CreateMeeting({ refresh }) {

  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const submitMeeting = async () => {

    if ((!title || !transcript) && !file) {
      toast.error("Provide transcript details or upload a file");
      return;
    }

    try {

      setLoading(true);
      setLastResult(null);

      if (file) {
        const fileName = file.name.toLowerCase();
        const fileExt = fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".")) : "";
        const isVideo = file.type.startsWith("video/") && ![".mpeg", ".mpg"].includes(fileExt);

        if (isVideo) {
          toast.error("Video files are not processed yet. Upload MP3, WAV, M4A, WhatsApp .mpeg audio, or a .txt transcript.");
          return;
        }
      }

      if (file) {
        const formData = new FormData();
        formData.append("title", title || file.name);
        formData.append("file", file);
        const response = await API.post("/meetings/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setLastResult(response.data || null);
      } else {
        const response = await API.post("/meetings/create", {
          title,
          transcript
        });
        setLastResult(response.data || null);
      }

      toast.success("AI summary generated successfully!");

      setTitle("");
      setTranscript("");
      setFile(null);

      refresh();

    } catch (error) {

      toast.error(error?.response?.data?.error || error?.message || "Something went wrong");

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
        accept=".txt,.pdf,.docx,.mp3,.wav,.m4a,.mpeg,.mpg"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
        onClick={submitMeeting}
        disabled={loading}
      >
        {loading ? "Processing Meeting..." : "Process Meeting"}
      </button>

      {lastResult?.meeting && (
        <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700 p-4 space-y-3">
          <div>
            <h3 className="font-semibold dark:text-white">Latest Summary</h3>
            <p className="text-sm text-gray-700 dark:text-gray-100 whitespace-pre-wrap">
              {lastResult.meeting.summary || "No summary available"}
            </p>
          </div>

          <div>
            <h3 className="font-semibold dark:text-white">Extracted Tasks</h3>
            {lastResult.tasks?.length ? (
              <ul className="mt-2 space-y-2 text-sm text-gray-700 dark:text-gray-100">
                {lastResult.tasks.map((task) => (
                  <li key={task._id || task.title} className="rounded-md bg-white/70 dark:bg-gray-800/60 p-2">
                    <p className="font-medium">{task.title}</p>
                    <p>Owner: {task.owner || "Unassigned"}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No tasks extracted.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default CreateMeeting;