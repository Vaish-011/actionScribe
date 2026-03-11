import { useState } from "react";
import API from "../services/api";
import toast from "react-hot-toast";

function CreateMeeting({ refresh }) {

  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);

  const submitMeeting = async () => {

    if (!title || !transcript) {
      toast.error("Please fill all fields");
      return;
    }

    try {

      setLoading(true);

      await API.post("/meetings/create", {
        title,
        transcript
      });

      toast.success("AI summary generated successfully!");

      setTitle("");
      setTranscript("");

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

      <button
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
        onClick={submitMeeting}
        disabled={loading}
      >
        {loading ? "Generating AI Summary..." : "Generate AI Summary"}
      </button>

    </div>
  );
}

export default CreateMeeting;