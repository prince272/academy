using Academy.Server.Utilities;
using FluentValidation;

namespace Academy.Server.Models.Payments
{
    public class MobileChargeModel
    {
        public string MobileNumber { get; set; }
    }

    public class MobileChargeValidator : AbstractValidator<MobileChargeModel>
    {
        public MobileChargeValidator()
        {
            RuleFor(_ => _.MobileNumber).Phone();
        }
    }
}
