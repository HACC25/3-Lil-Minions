"use client";

import { Card, CardBody } from "@nextui-org/react";

interface Certification {
  name: string;
}

interface Language {
  language: string;
  speak: boolean;
  read: boolean;
  write: boolean;
}

interface CertificationsLanguagesGridProps {
  certifications?: Certification[];
  languages?: Language[];
}

export function CertificationsLanguagesGrid({
  certifications,
  languages,
}: CertificationsLanguagesGridProps) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <Card className="bg-white/50 rounded-md backdrop-blur-md border border-white/30">
        <CardBody className="p-6">
          <h3 className="text-lg font-semibold text-black mb-4">
            Certifications
          </h3>
          {!certifications || certifications.length === 0 ? (
            <p className="text-sm text-black/70 italic">
              No certifications listed. Check resume for details.
            </p>
          ) : (
            <ul className="space-y-2">
              {certifications.map((cert, i) => (
                <li key={i} className="text-sm text-black font-medium">
                  • {cert.name}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card className="bg-white/50 rounded-md backdrop-blur-md border border-white/30">
        <CardBody className="p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Languages</h3>
          {!languages || languages.length === 0 ? (
            <p className="text-sm text-black/70 italic">
              No languages listed. Check resume for details.
            </p>
          ) : (
            <div className="space-y-3">
              {languages.map((lang, i) => (
                <div key={i}>
                  <p className="font-medium text-black mb-1">{lang.language}</p>
                  <p className="text-sm text-black/70">
                    {[
                      lang.speak && "Speak",
                      lang.read && "Read",
                      lang.write && "Write",
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
