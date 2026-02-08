import * as React from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { cn } from "../../lib/utils.js"

function Chart({ className, ...props }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={props.data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₹${value}`}
        />
        <Tooltip />
        <Line
          dataKey="total"
          fill="currentColor"
          className="fill-primary"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export { Chart }
