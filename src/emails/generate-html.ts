import { render } from "@react-email/render";
import { AuthEmail } from "./AuthEmail";
import * as fs from "fs";

// Para o Supabase, a URL gerada por eles é injetada com a variável {{ .ConfirmationURL }}
// e o site_url com {{ .SiteURL }}.

const generateHtml = async () => {
  const magicLinkHtml = await render(
    AuthEmail({
      type: "magic_link",
      username: "Dançarino(a)",
      magicLink: "{{ .ConfirmationURL }}",
    })
  );

  const resetPasswordHtml = await render(
    AuthEmail({
      type: "reset_password",
      username: "Dançarino(a)",
      magicLink: "{{ .ConfirmationURL }}",
    })
  );

  fs.writeFileSync("src/emails/supabase-magic-link.html", magicLinkHtml);
  fs.writeFileSync("src/emails/supabase-reset-password.html", resetPasswordHtml);
  
  console.log("Templates HTML do Supabase gerados em src/emails/ !");
};

generateHtml();
