export const USER_STATES = {
    ACTIVE: 'ACTIVO',
    INACTIVE: 'INACTIVO',
    PENDING: 'PENDIENTE',
};

export const USER_STATE_VALUES = Object.values(USER_STATES);

export const normalizeUserState = (state) => String(state ?? '').trim().toUpperCase();

export const isValidUserState = (state) => USER_STATE_VALUES.includes(normalizeUserState(state));

export const isPendingUser = (user) => normalizeUserState(user?.state) === USER_STATES.PENDING;

export const isInactiveUser = (user) => normalizeUserState(user?.state) === USER_STATES.INACTIVE;
