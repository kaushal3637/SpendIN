import { AlertCircle } from "lucide-react"

const Instructions = () => {
    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 sm:p-4 md:p-6">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600 flex-shrink-0" />
                Complete Setup Guide
            </h3>
            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4 mt-0.5 flex-shrink-0">
                        <span className="text-emerald-700 font-bold text-xs">1</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Enter Beneficiary Details</h4>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            Provide a unique Beneficiary ID and the full name. The ID should contain only alphanumeric characters.
                        </p>
                    </div>
                </div>

                <div className="flex items-start">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4 mt-0.5 flex-shrink-0">
                        <span className="text-emerald-700 font-bold text-xs">2</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Choose Payment Method</h4>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            Payment data: Provide a UPI ID & Bank Account Details.
                        </p>
                    </div>
                </div>

                <div className="flex items-start">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4 mt-0.5 flex-shrink-0">
                        <span className="text-emerald-700 font-bold text-xs">3</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Validate & Submit</h4>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            Review all information, then click &quot;Add Beneficiary&quot; to create beneficiary.                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Instructions;