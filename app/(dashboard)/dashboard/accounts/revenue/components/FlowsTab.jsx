"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Loading } from "@/app/components/ui/loading"

export default function FlowsTab({ 
    selectedAccounts,
    dateRangeSelection,
    stores
}) {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Flow Performance</CardTitle>
                    <CardDescription>Automated flow metrics and conversion tracking</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-96 text-gray-400">
                        Flow analytics coming soon...
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}