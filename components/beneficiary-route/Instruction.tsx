import { AlertTriangle } from "lucide-react";

export default function Instruction() {
    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 sm:p-4 md:p-6">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-400 flex-shrink-0" />
                Fill in Your Details Carefully
            </h3>
            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4 mt-0.5 flex-shrink-0">
                        <span className="text-emerald-700 font-bold text-xs">1</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Enter Beneficiary Name</h4>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            Provide the full name of the beneficiary. This should be the merchant or person name who will receive payments.
                        </p>
                    </div>
                </div>

                <div className="flex items-start">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4 mt-0.5 flex-shrink-0">
                        <span className="text-emerald-700 font-bold text-xs">2</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Enter UPI ID</h4>
                        <ul>
                            <li className="text-xs sm:text-sm text-slate-600 leading-relaxed">Provide a valid UPI ID.</li>
                            <li className="text-xs sm:text-sm text-slate-600 leading-relaxed">This will be used for sending UPI payments.</li>
                            <li className="text-xs sm:text-sm text-slate-600 leading-relaxed">Entering an incorrect UPI ID may result in financial loss.</li>
                        </ul>
                    </div>
                </div>

                <div className="flex items-start">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4 mt-0.5 flex-shrink-0">
                        <span className="text-emerald-700 font-bold text-xs">3</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Validate & Submit</h4>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            Review the entered information, then click &quot;Add Beneficiary&quot; to save the beneficiary.
                        </p>
                    </div>
                </div>

                <div className="flex items-start">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4 mt-0.5 flex-shrink-0">
                        <span className="text-emerald-700 font-bold text-xs">4</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Use in Payouts</h4>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            Once added, the beneficiary can be used in payment flows.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}