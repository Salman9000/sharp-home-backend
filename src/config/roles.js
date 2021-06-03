const roles = ['user', 'admin'];

const roleRights = new Map();
roleRights.set(roles[0], [
  'getDevice',
  'getUsers',
  'createDevice',
  'getRoom',
  'createRoom',
  'roomDevice',
  'createActivity',
  'getActivity',
  'getNotification',
]);
roleRights.set(roles[1], ['getUsers', 'manageUsers']);

module.exports = {
  roles,
  roleRights,
};
