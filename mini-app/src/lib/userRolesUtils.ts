

/**
 * Returns `true` if the user is:
 *  - an admin (user.role === 'admin'), OR
 *  - the owner of the event, OR
 *  - included in `eventData.data.accessRoles` by `user_id`.
 */
export function canUserManageEvent(
  user: { user_id: number; role: string } | null,
  eventData: { data?: { owner?: number | null; accessRoles?: Array<{ user_id: number; role: string }> } }
): boolean {
  console.log( "eventData", eventData)
  if (!user || !eventData?.data?.owner || !eventData.data.accessRoles) {
    return false;
  }
  const isAdmin = user.role === "admin";
  const isOwner = user.user_id === eventData?.data?.owner;

  // accessRoles is an array of { user_id: number, role: string }
  const accessRoles = eventData?.data?.accessRoles ?? [];
  const isInAccessRoles = accessRoles.some((ar) => ar.user_id === user.user_id  );

  return isAdmin || isOwner || isInAccessRoles;
}

export function canUserEditEvent(
  { user, accessRoles, owner }: {
    user: { user_id: number; role: string } | null,
    accessRoles?: Array<{ user_id: number; role: string }> | null,
    owner: number | null | undefined
  }
): boolean {

  if (!user || !owner || !accessRoles) {
    console.log( "user", user , "owner", owner, "accessRoles", accessRoles)
    return false;
  }
  const isAdmin = user.role === "admin";
  const isOwner = user.user_id === owner;

  // accessRoles is an array of { user_id: number, role: string }
  const accessRolesArray = accessRoles ?? [];

  const isInAccessRoles = accessRolesArray.some((ar:{ user_id: number; role: string } ) => ar.user_id === user.user_id  && ar.role === 'admin');

  return isAdmin || isOwner || isInAccessRoles;
}


export function canUserPerformRole(
  { user, accessRoles, allowedRoles }: {
    user: { user_id: number; role: string } | null,
    accessRoles?: Array<{ user_id: number; role: string }> | null,
    allowedRoles: string[]
  }
): boolean {
  if (!user || !accessRoles) {
    return false;
  }
  // 1) user is admin or organizer
  if (user.role === "admin" || user.role === "organizer") {
    return true;
  }

  // 2) Check if user appears in eventData.data.accessRoles with any of `allowedRoles`.
  const accessRolesArray = Array.isArray(accessRoles) ? accessRoles : [];
  return accessRolesArray.some((ar) => ar.user_id === user.user_id && allowedRoles.includes(ar.role));
}

export function CheckAdminOrOrganizer(role: string | undefined): boolean {
  return role === 'admin' || role === 'organizer';
}
