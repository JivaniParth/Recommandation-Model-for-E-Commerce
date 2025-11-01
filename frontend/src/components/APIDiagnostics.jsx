import { useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Loader } from "lucide-react";

export default function APIDiagnostics() {
  const [results, setResults] = useState({});
  const [testing, setTesting] = useState(false);

  const tests = [
    {
      name: "E-commerce API Health",
      url: "http://localhost:5000/api",
      description: "Checking if the main backend is running",
    },
    {
      name: "Books Endpoint",
      url: "http://localhost:5000/api/books",
      description: "Checking if books can be fetched",
    },
    {
      name: "Categories Endpoint",
      url: "http://localhost:5000/api/categories",
      description: "Checking if categories can be fetched",
    },
    {
      name: "Recommendations API",
      url: "http://localhost:4000/api",
      description: "Checking if recommendation backend is running",
    },
  ];

  const runTests = async () => {
    setTesting(true);
    const newResults = {};

    for (const test of tests) {
      try {
        const response = await fetch(test.url);
        const data = await response.json();

        newResults[test.name] = {
          status: response.ok ? "success" : "error",
          message: response.ok
            ? "Connected successfully"
            : `HTTP ${response.status}`,
          data: data,
        };
      } catch (error) {
        newResults[test.name] = {
          status: "error",
          message: error.message,
          data: null,
        };
      }
    }

    setResults(newResults);
    setTesting(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case "error":
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              API Diagnostics Tool
            </h1>
            <button
              onClick={runTests}
              disabled={testing}
              className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {testing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <span>Run All Tests</span>
              )}
            </button>
          </div>
          <p className="text-gray-600">
            This tool will help diagnose connection issues between your frontend
            and backend services.
          </p>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {tests.map((test) => {
            const result = results[test.name];

            return (
              <div
                key={test.name}
                className="bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="mt-1">
                        {result ? (
                          getStatusIcon(result.status)
                        ) : (
                          <AlertCircle className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {test.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {test.description}
                        </p>
                        <p className="text-xs font-mono text-gray-500 bg-gray-50 rounded px-2 py-1 inline-block">
                          {test.url}
                        </p>

                        {result && (
                          <div className="mt-4">
                            <div
                              className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                                result.status === "success"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              <span>{result.message}</span>
                            </div>

                            {result.data && (
                              <details className="mt-3">
                                <summary className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-800">
                                  View Response Data
                                </summary>
                                <pre className="mt-2 p-4 bg-gray-50 rounded-lg text-xs overflow-x-auto">
                                  {JSON.stringify(result.data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        {Object.keys(results).length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Troubleshooting Steps
            </h2>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Start the E-commerce Backend
                  </p>
                  <code className="block mt-1 p-2 bg-gray-50 rounded text-xs">
                    cd ecommerce-backend && npm start
                  </code>
                  <p className="mt-1">Should run on port 5000</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Start the Recommendations Backend
                  </p>
                  <code className="block mt-1 p-2 bg-gray-50 rounded text-xs">
                    cd backend && npm start
                  </code>
                  <p className="mt-1">Should run on port 4000</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Check Database Connection
                  </p>
                  <p className="mt-1">
                    Ensure PostgreSQL is running and migrations are applied
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold">
                  4
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Verify CORS Configuration
                  </p>
                  <p className="mt-1">
                    Both backends should allow requests from
                    http://localhost:5173
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
