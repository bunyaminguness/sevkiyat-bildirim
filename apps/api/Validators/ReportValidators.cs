using FluentValidation;
using SevkiyatBildirimApi.DTOs;

namespace SevkiyatBildirimApi.Validators;

public class CreateReportRequestValidator : AbstractValidator<CreateReportRequest>
{
    public CreateReportRequestValidator()
    {
        RuleFor(x => x.StoreCode)
            .NotEmpty().WithMessage("Mağaza kodu zorunludur");

        RuleFor(x => x.Type)
            .NotEmpty().WithMessage("Rapor tipi zorunludur")
            .Must(x => x == "Missing" || x == "Damaged")
            .WithMessage("Rapor tipi 'Missing' veya 'Damaged' olmalıdır");

        RuleFor(x => x.TplNo)
            .NotEmpty().WithMessage("TPL numarası zorunludur");

        RuleFor(x => x.ShipmentDate)
            .NotEmpty().WithMessage("Sevkiyat tarihi zorunludur");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("En az bir ürün eklemelisiniz")
            .Must(items => items != null && items.Count > 0)
            .WithMessage("En az bir ürün eklemelisiniz");

        RuleForEach(x => x.Items).SetValidator(new ReportItemRequestValidator());
    }
}

public class UpdateReportRequestValidator : AbstractValidator<UpdateReportRequest>
{
    public UpdateReportRequestValidator()
    {
        RuleFor(x => x.StoreCode)
            .NotEmpty().WithMessage("Mağaza kodu zorunludur");

        RuleFor(x => x.Type)
            .NotEmpty().WithMessage("Rapor tipi zorunludur")
            .Must(x => x == "Missing" || x == "Damaged")
            .WithMessage("Rapor tipi 'Missing' veya 'Damaged' olmalıdır");

        RuleFor(x => x.TplNo)
            .NotEmpty().WithMessage("TPL numarası zorunludur");

        RuleFor(x => x.ShipmentDate)
            .NotEmpty().WithMessage("Sevkiyat tarihi zorunludur");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("En az bir ürün eklemelisiniz")
            .Must(items => items != null && items.Count > 0)
            .WithMessage("En az bir ürün eklemelisiniz");

        RuleForEach(x => x.Items).SetValidator(new ReportItemRequestValidator());
    }
}

public class ReportItemRequestValidator : AbstractValidator<ReportItemRequest>
{
    public ReportItemRequestValidator()
    {
        RuleFor(x => x.ProductNo)
            .NotEmpty().WithMessage("Ürün numarası zorunludur");

        RuleFor(x => x.ProductName)
            .NotEmpty().WithMessage("Ürün adı zorunludur");

        RuleFor(x => x.Qty)
            .GreaterThan(0).WithMessage("Miktar 0'dan büyük olmalıdır");
    }
}

public class RejectReportRequestValidator : AbstractValidator<RejectReportRequest>
{
    public RejectReportRequestValidator()
    {
        RuleFor(x => x.RejectionReason)
            .NotEmpty().WithMessage("Red sebebi zorunludur");
    }
}
