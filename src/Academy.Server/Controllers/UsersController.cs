using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Models.Users;
using Academy.Server.Utilities;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Academy.Server.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IUnitOfWork unitOfWork;
        private readonly IMapper mapper;

        public UsersController(IServiceProvider serviceProvider)
        {
            unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
            mapper = serviceProvider.GetRequiredService<IMapper>();
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> Index(int pageNumber, int pageSize, [FromQuery] UserSearchModel search)
        {
            var currentUser = await HttpContext.Request.GetCurrentUserAsync();
            if (!currentUser.HasRoles(RoleConstants.Admin))
                return Result.Failed(StatusCodes.Status403Forbidden);

            var query = unitOfWork.Query<User>();

            var pageInfo = new PageInfo(await query.CountAsync(), pageNumber, pageSize);

            query = (pageInfo.SkipItems > 0 ? query.Skip(pageInfo.SkipItems) : query).Take(pageInfo.PageSize);

            var pageItems = await (await (query.Select(_ => _.Id).ToListAsync())).SelectAsync(async id =>
            {
                var model = await GetUserModel(id);
                if (model == null) throw new ArgumentException();
                return model;
            });

            return Result.Succeed(data: TypeMerger.Merge(new { Items = pageItems }, pageInfo));
        }

        [NonAction]
        private async Task<UserModel> GetUserModel(int userId)
        {
            var user = await unitOfWork.Query<User>().FirstOrDefaultAsync(_ => _.Id == userId);
            var userModel = mapper.Map<UserModel>(user);
            return userModel;
        }
    }
}
