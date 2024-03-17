import { listMyChartByPageUsingPost } from '@/services/LvJiBI/chartController';
import { useModel } from '@umijs/max';
import { Avatar, Card, List, Result, message } from 'antd';
import Search from 'antd/es/input/Search';
import ReactECharts from 'echarts-for-react';
import React, { useEffect, useState } from 'react';

/**
 * 我的图表页面
 * @returns 
 */
const MyChartPage: React.FC = () => {

  const initSearchParams = {
    current:1,
    pageSize: 4,
    sortField: 'createTime',
    sortOrder: 'desc',
  }

  const [searchParams, setsearchParams] = useState<API.ChartQueryRequest>({ ...initSearchParams });
  const [chartList, setChartList] = useState<API.Chart[]>();
  const [total, setTotal] = useState<number>(0);
  const {initialState,setInitialState} = useModel('@@initialState');
  const {currentUser} = initialState ?? {};
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * 调用后端接口获取数据
   */
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await listMyChartByPageUsingPost(searchParams);
      if (res.data) {
        setChartList(res.data?.records ?? []);
        setTotal(res.data?.total ?? 0);
        // 隐藏 genChart 种的 title
        if (res.data.records) {
          res.data.records.forEach(data => {
            if(data.status === 2){
            const chartOption = JSON.parse(data.genChart ?? '{}');
            chartOption.title = undefined;
            data.genChart = JSON.stringify(chartOption);
            }
          })
        }
      } else {
        message.error("获取我的图表失败");
      }
    } catch (error: any) {
      message.error("获取我的图表失败," + error.message)
    }
    setLoading(false);
  }
  /**
   * 页面初次加载、searchParams 发生变化时，都会调用 useEffect 这个钩子函数
   */
  useEffect(() => {
    loadData();
  }, [searchParams]);

  return (
    <div className="my-chart-page">
      <div>
        <Search placeholder="请输入图表名称" enterButton loading={loading} onSearch={(value) => {
          // 设置搜索条件
          setsearchParams ({
            ...initSearchParams,
            name: value,
          })
        }}/>
      </div>
      <div className="margin-16" />
      <List
        grid={{
          gutter: 16,
          xs: 1,
          sm: 1,
          md: 1,
          lg: 2,
          xl: 2,
          xxl: 2,
        }}
        // itemLayout="vertical"
        pagination={{
          onChange: (page, pageSize) => {
            setsearchParams ({
              ...searchParams,
              current: page,
              pageSize,
            })
          },
          current: searchParams.current,
          pageSize: searchParams.pageSize,
          total: total,
        }}
        loading={loading}
        dataSource={chartList}
        renderItem={(item) => (
          <List.Item key={item.id}>
            <Card style={{width:'100%'}}>
              <List.Item.Meta
                avatar={<Avatar src={currentUser && currentUser.userAvatar} />}
                title={item.name}
                description={item.chartType ? ('图表类型：' + item.chartType) : undefined}
              />
              <>
              {
                  item.status === 0 && <>
                    <Result
                      status="warning"
                      title="待生成"
                      subTitle={item.execMsg ?? '当前图表生成队列繁忙，请耐心等候'}
                    />
                  </>
                }
                {
                  item.status === 1 && <>
                    <Result
                      status="info"
                      title="图表生成中"
                      subTitle={item.execMsg}
                    />
                  </>
                }
                {
                  item.status === 2 && <>
                    <div style={{ marginBottom: 16 }} />
                    <p>{'分析目标：' + item.goal}</p>
                    <div style={{ marginBottom: 16 }} />
                    <ReactECharts option={item.genChart && JSON.parse(item.genChart ?? '{}')} />
                  </>
                }
                {
                  item.status === 3 && <>
                    <Result
                      status="error"
                      title="图表生成失败"
                      subTitle={item.execMsg}
                    />
                  </>
                }
              </>
            </Card>
          </List.Item>
        )}
      />
      总数：{total}
    </div>

  );
};
export default MyChartPage;
