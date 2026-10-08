import { describe, expect, it } from "vitest";
import { siteConfig } from "../shared/siteConfig";

describe("siteConfig", () => {
  it("keeps the supplied social and helpline destinations", () => {
    expect(siteConfig.socialLinks.telegram).toBe("https://t.me/+8801706559143");
    expect(siteConfig.socialLinks.whatsapp).toBe("https://wa.me/8801324360629");
    expect(siteConfig.socialLinks.facebookPage).toBe(
      "https://www.facebook.com/malaysiasingapore4d6d/"
    );
    expect(siteConfig.socialLinks.facebookShare).toBe(
      "https://www.facebook.com/share/19cy7B811n/"
    );
    expect(siteConfig.socialLinks.instagram).toBe(
      "https://www.instagram.com/4d6dmktshe/"
    );
  });
});
