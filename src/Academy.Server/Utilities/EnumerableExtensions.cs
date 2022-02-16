using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Academy.Server.Utilities
{
    public static class EnumerableExtensions
    {
        // Async await in linq select
        // source: https://stackoverflow.com/questions/35011656/async-await-in-linq-select/64363463#64363463
        public static async Task<IEnumerable<TResult>> SelectAsync<TSource, TResult>(
            this IEnumerable<TSource> source, Func<TSource, int, Task<TResult>> method,
            int concurrency = 1)
        {
            var semaphore = new SemaphoreSlim(concurrency);
            try
            {
                return await Task.WhenAll(source.Select(async (s, i) =>
                {
                    try
                    {
                        await semaphore.WaitAsync();
                        return await method(s, i);
                    }
                    finally
                    {
                        semaphore.Release();
                    }
                }));
            }
            finally
            {
                semaphore.Dispose();
            }
        }

        public static Task<IEnumerable<TResult>> SelectAsync<TSource, TResult>(
            this IEnumerable<TSource> source, Func<TSource, Task<TResult>> method,
            int concurrency = 1)
        {
            return SelectAsync(source, (s, i) => method(s), concurrency);
        }

        public static async Task ForEachAsync<TSource>(
            this IEnumerable<TSource> source, Func<TSource, int, Task> method,
            int concurrency = 1)
        {
            var semaphore = new SemaphoreSlim(concurrency);
            try
            {
                await Task.WhenAll(source.Select(async (s, i) =>
                {
                    try
                    {
                        await semaphore.WaitAsync();
                        await method(s, i);
                    }
                    finally
                    {
                        semaphore.Release();
                    }
                }));
            }
            finally
            {
                semaphore.Dispose();
            }
        }

        public static Task ForEachAsync<TSource>(
            this IEnumerable<TSource> source, Func<TSource, Task> method,
            int concurrency = 1)
        {
            return ForEachAsync(source, (s, i) => method(s), concurrency);
        }


        public static void ForEach<T>(this List<T> source, Action<T, int> action)
        {
            foreach (var (item, index) in source.Select((item, index) => (item, index)))
                action(item, index);
        }

        public static void ForEach<T>(this IEnumerable<T> source, Action<T> action)
        {
            foreach (var item in source)
                action(item);
        }


        // JavaScript splice in c#
        // source: https://stackoverflow.com/questions/28833373/javascript-splice-in-c-sharp
        public static List<T> Splice<T>(this List<T> list, int index, int count, params T[] newItems)
        {
            var removeItems = list.Skip(index).Take(count).ToList();

            if (list.Count >= count)
                list.RemoveRange(index, count);

            if (newItems != null && newItems.Length != 0)
                list.InsertRange(index, newItems);

            return removeItems;
        }

        // Move an item from one position to another position.
        // source: https://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another?rq=1
        public static void Move<T>(this List<T> list, int fromIndex, int toIndex)
        {
            var element = list[fromIndex];
            list.Splice(fromIndex, 1);
            list.Splice(toIndex, 0, element);
        }

        // Move an item from one array to another array.
        public static void Transfer<T>(this List<T> fromList, int fromIndex, int toIndex, List<T> toList)
        {
            toList.Splice(toIndex, 0, fromList.Splice(fromIndex, 1)[0]);
        }

        public static int Replace<T>(this IList<T> source, T oldValue, T newValue)
        {
            if (source == null)
                throw new ArgumentNullException(nameof(source));

            var index = source.IndexOf(oldValue);
            if (index != -1)
                source[index] = newValue;
            return index;
        }

        public static void ReplaceAll<T>(this IList<T> source, T oldValue, T newValue)
        {
            if (source == null)
                throw new ArgumentNullException(nameof(source));

            int index = -1;
            do
            {
                index = source.IndexOf(oldValue);
                if (index != -1)
                    source[index] = newValue;
            } while (index != -1);
        }
    }
}