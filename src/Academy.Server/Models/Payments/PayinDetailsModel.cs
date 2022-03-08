using Academy.Server.Data.Entities;
using Academy.Server.Utilities;
using FluentValidation;

namespace Academy.Server.Models.Payments
{
    public class PayinDetailsModel
    {
        public string MobileNumber { get; set; }

        public PaymentMode Mode { get; set; }
    }

    public class MobileCashinValidator : AbstractValidator<PayinDetailsModel>
    {
        public MobileCashinValidator()
        {
            RuleFor(_ => _.MobileNumber).Phone().When(_ => _.Mode == PaymentMode.Mobile);
        }
    }
}
