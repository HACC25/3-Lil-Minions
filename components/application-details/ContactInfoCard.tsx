"use client";

import { Card, CardBody } from "@nextui-org/react";

interface ContactInfoCardProps {
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export function ContactInfoCard({
  email,
  phone,
  address,
  city,
  state,
  zipCode,
}: ContactInfoCardProps) {
  return (
    <Card className="bg-white/20 rounded-md backdrop-blur-md border border-white/10">
      <CardBody className="p-6">
        <h3 className="text-lg font-semibold text-black mb-4">
          Contact Information
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-black/70 mb-1">Email</p>
            <p className="text-black font-medium">{email}</p>
          </div>
          {phone && (
            <div>
              <p className="text-xs text-black/70 mb-1">Phone</p>
              <p className="text-black font-medium">{phone}</p>
            </div>
          )}
          {address && (
            <div>
              <p className="text-xs text-black/70 mb-1">Address</p>
              <p className="text-black font-medium">
                {address}
                {city && `, ${city}`}
                {state && `, ${state}`}
                {zipCode && ` ${zipCode}`}
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
