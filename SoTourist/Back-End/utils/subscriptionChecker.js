function downgradeIfExpired(user) {
  if (
    user.type !== 'standard' &&
    (!user.subscriptionEnd || new Date(user.subscriptionEnd) < new Date())
  ) {
    user.type = 'standard';
    user.subscriptionEnd = null;
  }
  return user;
}

module.exports = { downgradeIfExpired };
