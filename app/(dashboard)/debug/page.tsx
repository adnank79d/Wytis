import { getDashboardMetrics } from "@/lib/actions/dashboard";

export const dynamic = 'force-dynamic';

export default async function DebugPage() {
    const metrics = await getDashboardMetrics();

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Dashboard Debug - Raw Data</h1>

            <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <h2 className="font-bold mb-2">Raw Metrics Object:</h2>
                <pre className="text-xs overflow-auto">
                    {JSON.stringify(metrics, null, 2)}
                </pre>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="border p-4 rounded">
                    <div className="text-sm text-gray-600">Revenue</div>
                    <div className="text-2xl font-bold">₹{metrics.revenue}</div>
                </div>

                <div className="border p-4 rounded">
                    <div className="text-sm text-gray-600">Net Profit</div>
                    <div className="text-2xl font-bold">₹{metrics.netProfit}</div>
                </div>

                <div className="border p-4 rounded">
                    <div className="text-sm text-gray-600">Receivables</div>
                    <div className="text-2xl font-bold">₹{metrics.receivables}</div>
                </div>

                <div className="border p-4 rounded">
                    <div className="text-sm text-gray-600">GST Payable</div>
                    <div className="text-2xl font-bold">₹{metrics.gstPayable}</div>
                </div>
            </div>

            <div className="mt-8">
                <a href="/dashboard" className="text-blue-600 hover:underline">
                    ← Back to Dashboard
                </a>
            </div>
        </div>
    );
}
