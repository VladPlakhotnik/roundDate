type AccountVerificationEmailProps = {
  name?: string | null;
  verificationUrl: string;
};

export default function AccountVerificationEmail({
  name,
  verificationUrl,
}: AccountVerificationEmailProps) {
  return (
    <html lang="pl">
      <body>
        <h1>Potwierdz konto Speed Dating</h1>
        <p>Czesc{name ? `, ${name}` : ""}.</p>
        <p>Kliknij link, aby potwierdzic konto i dokonczyc rejestracje.</p>
        <a href={verificationUrl}>Potwierdz konto</a>
      </body>
    </html>
  );
}
