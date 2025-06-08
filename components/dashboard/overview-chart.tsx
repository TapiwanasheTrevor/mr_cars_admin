"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChartData {
  month: string;
  users: number;
  listings: number;
  orders: number;
  revenue: number;
}

interface OverviewChartProps {
  data: ChartData[];
  isLoading: boolean;
}

interface ListingStatusChartProps {
  activeCount: number;
  inactiveCount: number;
  isLoading: boolean;
}

const data = [
  {
    name: "Jan",
    users: 400,
    listings: 240,
    revenue: 2400,
  },
  {
    name: "Feb",
    users: 300,
    listings: 139,
    revenue: 2210,
  },
  {
    name: "Mar",
    users: 200,
    listings: 980,
    revenue: 2290,
  },
  {
    name: "Apr",
    users: 278,
    listings: 390,
    revenue: 2000,
  },
  {
    name: "May",
    users: 189,
    listings: 480,
    revenue: 2181,
  },
  {
    name: "Jun",
    users: 239,
    listings: 380,
    revenue: 2500,
  },
  {
    name: "Jul",
    users: 349,
    listings: 430,
    revenue: 2100,
  },
  {
    name: "Aug",
    users: 278,
    listings: 390,
    revenue: 2000,
  },
  {
    name: "Sep",
    users: 189,
    listings: 480,
    revenue: 2181,
  },
  {
    name: "Oct",
    users: 239,
    listings: 380,
    revenue: 2500,
  },
  {
    name: "Nov",
    users: 349,
    listings: 430,
    revenue: 2100,
  },
  {
    name: "Dec",
    users: 278,
    listings: 390,
    revenue: 2000,
  },
];

const pieData = [
  { name: "Active", value: 400, fill: "hsl(var(--chart-1))" },
  { name: "Inactive", value: 300, fill: "hsl(var(--chart-3))" },
];

export function OverviewChart({ data: chartData, isLoading }: OverviewChartProps) {
  const [chartType, setChartType] = useState("line");
  const [dataType, setDataType] = useState("users");

  // Use real data if available, otherwise fall back to default data
  const displayData = chartData.length > 0 ? chartData.map(item => ({
    name: item.month,
    users: item.users,
    listings: item.listings,
    revenue: item.revenue,
  })) : data;

  if (isLoading) {
    return (
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            Platform performance over the last year
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Tabs defaultValue="users" className="w-[200px]">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users" onClick={() => setDataType("users")}>
                Users
              </TabsTrigger>
              <TabsTrigger
                value="listings"
                onClick={() => setDataType("listings")}
              >
                Listings
              </TabsTrigger>
              <TabsTrigger
                value="revenue"
                onClick={() => setDataType("revenue")}
              >
                Revenue
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs defaultValue="line" className="w-[200px]">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="line" onClick={() => setChartType("line")}>
                Line
              </TabsTrigger>
              <TabsTrigger value="bar" onClick={() => setChartType("bar")}>
                Bar
              </TabsTrigger>
              <TabsTrigger value="area" onClick={() => setChartType("area")}>
                Area
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart
              data={displayData}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={dataType}
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          ) : chartType === "bar" ? (
            <BarChart
              data={displayData}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip />
              <Bar
                dataKey={dataType}
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <AreaChart
              data={displayData}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey={dataType}
                stroke="hsl(var(--chart-1))"
                fill="hsl(var(--chart-1))"
                fillOpacity={0.2}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ListingStatusChart({ activeCount, inactiveCount, isLoading }: ListingStatusChartProps) {
  const pieData = [
    { name: "Active", value: activeCount, fill: "hsl(var(--chart-1))" },
    { name: "Inactive", value: inactiveCount, fill: "hsl(var(--chart-3))" },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Listing Status</CardTitle>
          <CardDescription>Loading listing data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Listing Status</CardTitle>
        <CardDescription>Current status of all listings</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            />
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}