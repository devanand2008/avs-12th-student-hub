export type PhoneOtpConfiguration = {
  state: "enabled" | "disabled" | "unavailable";
  provider?: string;
  message: string;
};

// Auth settings report whether phone login is enabled, not whether an SMS
// provider can deliver messages. This check never sends an OTP.
export async function getPhoneOtpConfiguration(): Promise<PhoneOtpConfiguration> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  const unavailable: PhoneOtpConfiguration = {
    state: "unavailable",
    message:
      "Could not check phone authentication. Check the Supabase Auth settings and try again.",
  };
  if (!url || !key) return unavailable;
  try {
    const response = await fetch(
      new URL("auth/v1/settings", url.replace(/\/$/, "") + "/"),
      {
        headers: { apikey: key },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!response.ok) return unavailable;
    const settings = await response.json();
    if (typeof settings?.external?.phone !== "boolean") return unavailable;
    const provider = [
      "twilio",
      "twilio_verify",
      "messagebird",
      "vonage",
      "textlocal",
    ].includes(settings.sms_provider)
      ? (settings.sms_provider as string)
      : undefined;
    return settings.external.phone
      ? {
          state: "enabled",
          provider,
          message:
            "Phone authentication is enabled. Confirm your SMS provider credentials and test delivery to a mobile number you control before activating students.",
        }
      : {
          state: "disabled",
          provider,
          message:
            "SMS verification is unavailable because phone authentication is disabled. Configure an SMS provider and enable Phone in Supabase Authentication.",
        };
  } catch {
    return unavailable;
  }
}
