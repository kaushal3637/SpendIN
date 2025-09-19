import Instructions from '@/components/data-generation/Instruction'
import Beneficiary from '@/components/forms/Beneficiary'

export default function BeneficiaryPage() {
    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="flex-1 w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8 md:mb-10">
                    <div className="flex items-center justify-center mb-3 sm:mb-4">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900">Add Beneficiary</h1>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto px-2 leading-relaxed">
                        Add beneficiaries to SpendIN for seamless payout.
                    </p>
                </div>

                <div className="space-y-4 sm:space-y-6 md:space-y-8 flex-1 flex flex-col">
                    <Beneficiary />
                    <Instructions />
                </div>
            </div>
        </div>
    )
}