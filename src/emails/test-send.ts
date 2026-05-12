const sendTestEmail = async () => {
  const response = await fetch("http://localhost:3000/api/send-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "congresso4dance@gmail.com",
      type: "welcome",
      username: "Agnaldo",
    }),
  });

  const data = await response.json();
  console.log("Status do envio:", data);
};

sendTestEmail();
