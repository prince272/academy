using Academy.Server.Data.Entities;
using Academy.Server.Utilities;
using FluentValidation;

namespace Academy.Server.Models.Payments
{
    public class MobileDetailsModel
    {
        public string MobileNumber { get; set; }
    }

    public class MobileDetailsValidator : AbstractValidator<MobileDetailsModel>
    {
        public MobileDetailsValidator()
        {
            RuleFor(_ => _.MobileNumber).Phone();
        }
    }
}
