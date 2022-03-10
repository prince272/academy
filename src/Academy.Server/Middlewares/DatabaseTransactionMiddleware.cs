﻿using Academy.Server.Data;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace Academy.Server.Middlewares
{
    // ASP.NET Core Web API - How to hide DbContext transaction in the middleware pipeline?
    // source: https://stackoverflow.com/questions/58225119/asp-net-core-web-api-how-to-hide-dbcontext-transaction-in-the-middleware-pipel/62587685#62587685
    public class DatabaseTransactionMiddleware
    {
        private readonly RequestDelegate next;

        public DatabaseTransactionMiddleware(RequestDelegate next)
        {
            this.next = next;
        }

        public async Task Invoke(HttpContext httpContext, AppDbContext context)
        {
            string requestMethod = httpContext.Request.Method;

            if (HttpMethods.IsPost(requestMethod) || HttpMethods.IsPut(requestMethod) || HttpMethods.IsDelete(requestMethod))
            {
                var strategy = context.Database.CreateExecutionStrategy();
                await strategy.ExecuteAsync<object, object>(null!, operation: async (dbctx, state, cancel) =>
                {
                    // start the transaction
                    await using var transaction = await context.Database.BeginTransactionAsync();

                    // invoke next middleware 
                    await next(httpContext);

                    // commit the transaction
                    await transaction.CommitAsync();

                    return null!;
                }, null);
            }
            else
            {
                await next(httpContext);
            }
        }
    }

    public static class TransactionMiddlewareExtensions
    {
        public static IApplicationBuilder UseDatabaseTransaction(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<DatabaseTransactionMiddleware>();
        }
    }
}