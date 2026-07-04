import {
  banAdminTeamMemberAction,
  getAdminTeamPageData,
  inviteAdminTeamMemberAction,
  removeAdminTeamMemberAction,
  unbanAdminTeamMemberAction,
  updateAdminTeamRoleAction,
} from "@/admin/server/team";
import { AdminTeamView } from "@/views/admin-team/AdminTeamView";

export default async function AdminTeamPage() {
  const data = await getAdminTeamPageData();

  return (
    <AdminTeamView
      banMemberAction={banAdminTeamMemberAction}
      data={data}
      inviteMemberAction={inviteAdminTeamMemberAction}
      removeMemberAction={removeAdminTeamMemberAction}
      unbanMemberAction={unbanAdminTeamMemberAction}
      updateRoleAction={updateAdminTeamRoleAction}
    />
  );
}
