import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import CreateMeeting from "../components/CreateMeeting";

function Dashboard() {

  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    const res = await API.get("/tasks");
    setTasks(res.data);
  };

  const completeTask = async (id) => {
    await API.patch(`/tasks/${id}/complete`);
    fetchTasks();
  };

  useEffect(() => {
    fetchTasks();
  }, []);



  
  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">

      <Navbar />

      <div className="max-w-4xl mx-auto p-6">

        <CreateMeeting refresh={fetchTasks} />

        <h2 className="text-xl dark:text-white font-bold mt-6 mb-3">
          Tasks
        </h2>

        {tasks.map(task => (

          <div
            key={task._id}
            className="bg-white dark:bg-gray-800 text-black dark:text-white shadow p-4 mb-3 rounded"
          >

            <h3 className="font-semibold">
              {task.task}
            </h3>

            <p>Owner: {task.owner}</p>
            <p>Deadline: {task.deadline}</p>

            <p className="mb-2">
              Status: {task.completed ? "Completed" : "Pending"}
            </p>

            {!task.completed && (
              <button
                className="bg-green-600 text-white px-3 py-1 rounded"
                onClick={() => completeTask(task._id)}
              >
                Mark Complete
              </button>
            )}

          </div>

        ))}

      </div>

    </div>
  );
}

export default Dashboard;