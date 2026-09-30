/** Encoded draft only: the visitor's email application sends the message. */
export function emailDraftUrl(action: string, data: FormData): string {
  const name = String(data.get("Name") ?? "").trim() || "New project";
  const subject = "Anza Works project enquiry — " + name;
  const body = [...data].map(([key, value]) => key + ": " + (String(value).trim() || "—")).join("\n");
  return action + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
}

export function initEmailDraft(
  form: HTMLFormElement,
  status: HTMLElement | null,
  openDraft: (url: string) => void = url => { location.href = url; }
): { destroy(): void } {
  const controller = new AbortController();
  const { signal } = controller;
  const name = form.querySelector<HTMLInputElement>("#name")!;
  const message = form.querySelector<HTMLTextAreaElement>("#message")!;
  for (const field of [name, message]) {
    field.addEventListener("input", () => field.setCustomValidity(""), { signal });
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    name.setCustomValidity(name.value.trim() ? "" : "Enter your name.");
    message.setCustomValidity(message.value.trim().length >= 15 ? "" : "Describe your project in at least 15 characters.");
    if (!form.reportValidity()) return;
    const action = form.getAttribute("action") ?? "";
    if (!action.startsWith("mailto:")) return;
    const url = emailDraftUrl(action, new FormData(form));
    if (status) status.textContent = "Your email app should open a draft. Review it and send it there; nothing was submitted to this site.";
    openDraft(url);
  }, { signal });
  return { destroy() { controller.abort(); } };
}
