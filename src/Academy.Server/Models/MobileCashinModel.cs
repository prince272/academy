using Academy.Server.Utilities;
using FluentValidation;

namespace Academy.Server.Models.Payments
{
    public class MobileCashinModel
    {
        public string MobileNumber { get; set; }
    }

    public class MobileCashinValidator : AbstractValidator<MobileCashinModel>
    {
        public MobileCashinValidator()
        {
            RuleFor(_ => _.MobileNumber).Phone();
        }
    }
}
