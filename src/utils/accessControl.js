export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  GROUP_ADMIN: 'GROUP_ADMIN',
  HOTEL_MANAGER: 'HOTEL_MANAGER',
  FRONT_DESK: 'FRONT_DESK',
  SUPPORT_AGENT: 'SUPPORT_AGENT',
};

// Map UI features to Backend Permission Codes OR Role-based fallbacks
export const PERMISSIONS = {
  // --- USER MANAGEMENT ---
  VIEW_USERS: 'CAN_VIEW_USERS',
  CREATE_GROUP_ADMIN: [ROLES.SUPER_ADMIN],
  CREATE_HOTEL_MANAGER: [ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN],
  CREATE_STAFF: [ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN, ROLES.HOTEL_MANAGER],
  UPDATE_USER: [ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN, ROLES.HOTEL_MANAGER],
  DELETE_USER: [ROLES.SUPER_ADMIN], // Strict for now
  ASSIGN_HOTELS: 'CAN_ASSIGN_HOTEL',

  // --- HOTEL MANAGEMENT ---
  VIEW_HOTELS: 'CAN_VIEW_HOTEL_DATA',
  CREATE_HOTEL: 'CAN_CREATE_HOTEL',
  UPDATE_HOTEL: 'CAN_UPDATE_HOTEL',
  DELETE_HOTEL: 'CAN_DELETE_HOTEL',
  MANAGE_AMENITIES: 'CAN_MANAGE_AMENITIES',
  PLATFORM_COMMISSION: [ROLES.SUPER_ADMIN],

  // --- OPERATIONS (Bookings & Rooms) ---
  VIEW_BOOKINGS: [ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN, ROLES.HOTEL_MANAGER, ROLES.FRONT_DESK],
  WALK_IN_BOOKING: [ROLES.HOTEL_MANAGER, ROLES.FRONT_DESK],
  CHECK_IN_OUT: [ROLES.HOTEL_MANAGER, ROLES.FRONT_DESK],
  MANAGE_ROOMS: 'CAN_MANAGE_ROOMS',
  UPDATE_ROOM_STATUS: [ROLES.HOTEL_MANAGER, ROLES.FRONT_DESK],
  HOURLY_OPERATIONS: [ROLES.HOTEL_MANAGER, ROLES.GROUP_ADMIN],

  // --- FINANCIALS ---
  VIEW_PLATFORM_FINANCIALS: [ROLES.SUPER_ADMIN],
  VIEW_HOTEL_FINANCIALS: [ROLES.GROUP_ADMIN, ROLES.HOTEL_MANAGER],
};

/**
 * Checks if a user has permission to perform an action.
 * @param {Object} user - The user object (contains role, permissions, hotel_ids).
 * @param {string} featureKey - The feature key from PERMISSIONS object.
 * @returns {boolean}
 */
export const can = (user, featureKey) => {
  if (!user || !user.role) return false;
  
  // Super Admin bypass
  if (user.role === ROLES.SUPER_ADMIN) return true;

  const requirement = PERMISSIONS[featureKey];
  if (!requirement) return false;

  // Case 1: Requirement is a Granular Permission String (Backend Code)
  if (typeof requirement === 'string') {
    return user.permissions?.includes(requirement);
  }

  // Case 2: Requirement is an Array of allowed Roles
  if (Array.isArray(requirement)) {
    return requirement.includes(user.role);
  }

  return false;
};
