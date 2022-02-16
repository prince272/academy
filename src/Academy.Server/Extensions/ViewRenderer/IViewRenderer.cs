using System.Threading.Tasks;

namespace Academy.Server.Extensions.ViewRenderer
{
    public interface IViewRenderer
    {
        Task<string> RenderToStringAsync<TModel>(string viewName, TModel model);
    }
}
