exports.handler = async (event) => {
  event.response.autoConfirmUser = true;

  // Optional: Only include these if you're still collecting email or phone number
  // event.response.autoVerifyEmail = true;
  // event.response.autoVerifyPhone = true;

  return event;
};
