const TRUSTED_HTTPS_HOSTS = new Set([
  "ragnadex.com",
  "www.ragnadex.com",
  "github.com",
  "raw.githubusercontent.com",
  "www.gnu.org",
  "www.iso.org",
  "roz.mygnjoy.com",
]);

function trustedExternalUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !TRUSTED_HTTPS_HOSTS.has(url.hostname)) return null;
    url.username = "";
    url.password = "";
    return url.toString();
  } catch {
    return null;
  }
}

module.exports = { TRUSTED_HTTPS_HOSTS, trustedExternalUrl };
