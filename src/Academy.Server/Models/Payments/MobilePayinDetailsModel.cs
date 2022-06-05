using Academy.Server.Data.Entities;
using Academy.Server.Utilities;
using FluentValidation;

namespace Academy.Server.Models.Payments
{
    public class MobilePayinDetailsModel
    {
        public string MobileNumber { get; set; }
    }

    public class MobilePayinDetailsValidator : AbstractValidator<MobilePayinDetailsModel>
    {
        public MobilePayinDetailsValidator()
        {
            RuleFor(_ => _.MobileNumber).Phone();
        }
    }
}
