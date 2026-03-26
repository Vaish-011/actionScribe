import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";
import toast from "react-hot-toast";

function AdminPanel() {
  const [organization, setOrganization] = useState(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [orgName, setOrgName] = useState("");

  const loadOrganization = async () => {
    try {
      const res = await API.get("/organizations");
      setOrganization(res.data);
      setOrgName(res.data?.name || "");
    } catch (error) {
      setOrganization(null);
    }
  };

  const createOrganization = async () => {
    if (!orgName.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    try {
      await API.post("/organizations/create", { name: orgName.trim() });
      toast.success("Workspace created");
      loadOrganization();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to create workspace");
    }
  };

  const inviteMember = async () => {
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    try {
      await API.post("/organizations/invite", { email: email.trim(), role });
      toast.success("Member invited");
      setEmail("");
      loadOrganization();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to invite member");
    }
  };

  useEffect(() => {
    loadOrganization();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid lg:grid-cols-3 gap-4">
        <section className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-bold mb-3 dark:text-white">Workspace Settings</h2>
          <label className="text-sm text-gray-600 dark:text-gray-300">Workspace Name</label>
          <input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-3 py-2 mt-1"
            placeholder="ActionScribe Workspace"
          />
          <button onClick={createOrganization} className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm">Save Workspace</button>

          {organization && (
            <div className="mt-4 rounded-lg bg-slate-50 dark:bg-gray-700 p-3 text-sm dark:text-gray-100">
              <p><span className="font-medium">Members:</span> {organization.members?.length || 0}</p>
              <p><span className="font-medium">Created:</span> {new Date(organization.createdAt).toLocaleDateString()}</p>
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-bold mb-3 dark:text-white">Invite Team Member</h2>
          <label className="text-sm text-gray-600 dark:text-gray-300">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-3 py-2 mt-1"
            placeholder="member@company.com"
          />

          <label className="text-sm text-gray-600 dark:text-gray-300 mt-3 block">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-3 py-2 mt-1"
          >
            <option value="member">Member</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>

          <button onClick={inviteMember} className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm">Invite</button>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-bold mb-3 dark:text-white">Team Members</h2>
          <div className="space-y-2 max-h-[60vh] overflow-auto">
            {(organization?.members || []).map((member) => (
              <div key={member.user?._id || `${member.user}-${member.role}`} className="rounded-lg border border-gray-200 dark:border-gray-600 p-3">
                <p className="font-medium dark:text-white">{member.user?.name || "Pending user"}</p>
                <p className="text-sm text-gray-500 dark:text-gray-300">{member.user?.email || "Invitation pending"}</p>
                <span className="inline-block mt-1 text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">{member.role}</span>
              </div>
            ))}
            {!organization?.members?.length && <p className="text-sm text-gray-500">No members found.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminPanel;
