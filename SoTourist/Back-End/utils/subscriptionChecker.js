function downgradeIfExpired(user) {
  if (
    user.type !== 'standard' &&
    (!user.subscriptionEndDate || new Date(user.subscriptionEndDate) < new Date())
  ) {
    user.type = 'standard';
    user.subscriptionEndDate = null;
  }
  return user;
}

module.exports = { downgradeIfExpired };