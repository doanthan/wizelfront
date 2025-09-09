"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Loading } from "@/app/components/ui/loading"

export default function DeliverabilityTab({ 
    selectedAccounts,
    dateRangeSelection,
    stores
}) {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Deliverability Metrics</CardTitle>
                    <CardDescription>Email deliverability and engagement health</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-96 text-gray-400">
                        Deliverability analytics coming soon...
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}