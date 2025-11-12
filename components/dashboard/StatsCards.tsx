"use client";

import React from "react";
import { Card, CardBody } from "@nextui-org/react";
import { Briefcase, CheckCircle, Users, Clock } from "lucide-react";
import { frostedGlassBg } from "@/utils/styles";
import { cn } from "@/utils/styles";
interface StatCardData {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface StatsCardsProps {
  totalJobs?: number;
  activeJobs?: number;
  totalApplications?: number;
  draftJobs?: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalJobs = 0,
  activeJobs = 0,
  totalApplications = 0,
  draftJobs = 0,
}) => {
  const stats: StatCardData[] = [
    {
      title: "Total Jobs",
      value: totalJobs,
      icon: <Briefcase size={24} />,
      color: "text-blue-600",
      bgColor: "bg-blue-50/40",
    },
    {
      title: "Active Jobs",
      value: activeJobs,
      icon: <CheckCircle size={24} />,
      color: "text-green-600",
      bgColor: "bg-green-50/40",
    },
    {
      title: "Total Applications",
      value: totalApplications,
      icon: <Users size={24} />,
      color: "text-purple-600",
      bgColor: "bg-purple-50/40",
    },
    {
      title: "Draft Jobs",
      value: draftJobs,
      icon: <Clock size={24} />,
      color: "text-orange-600",
      bgColor: "bg-orange-50/40",
    },
  ];

  return (
    <div className="flex w-full flex-wrap gap-3 justify-center">
      {stats.map((stat, index) => (
        <Card key={index} className={cn(frostedGlassBg)}>
          <CardBody className="p-6">
            <div className="flex items-start gap-x-5 justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 mb-1">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} ${stat.color} p-3 rounded-xl`}>
                {stat.icon}
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};
